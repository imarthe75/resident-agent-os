"""
UserAuthWorkflowService: Maneja el flujo de autenticación OIDC con Authentik
Sincroniza usuarios desde Authentik/Gitea a Plane
"""

import logging
from typing import Optional, Dict, Any, Callable
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import HttpRequest

logger = logging.getLogger(__name__)
User = get_user_model()


def post_user_auth_workflow(
    user: User,
    response: Dict[str, Any],
    backend_name: str = "oidc",
    **kwargs
) -> Callable:
    """
    Ejecuta el flujo post-autenticación (actualización de perfil, creación de workspace, etc).
    Compatible con python-social-auth pipelines.

    Args:
        user: Usuario autenticado
        response: Respuesta del proveedor OIDC
        backend_name: Nombre del backend
        **kwargs: Parámetros adicionales

    Returns:
        Función decoradora que ejecuta el flujo
    """
    def post_auth_flow(func):
        def wrapper(*args, **kw):
            try:
                # Actualizar usuario con información de OIDC
                UserAuthWorkflowService.update_user_from_oidc_response(
                    user, response
                )

                # Ejecutar la función original
                result = func(*args, **kw)

                logger.info(
                    f"Post-auth workflow completado para usuario {user.email}"
                )
                return result

            except Exception as e:
                logger.error(
                    f"Error en post_user_auth_workflow: {e}",
                    exc_info=True
                )
                return func(*args, **kw)

        return wrapper
    return post_auth_flow


class UserAuthWorkflowService:
    """
    Gestiona el flujo de autenticación y creación de usuarios desde OIDC.

    Responsabilidades:
    - Crear/actualizar usuarios basados en claims de OIDC
    - Manejar información de Gitea/Authentik
    - Sincronizar atributos del usuario
    """

    @staticmethod
    def get_or_create_user_from_oidc(
        response: Dict[str, Any],
        backend_name: str = "oidc",
        **kwargs
    ) -> tuple[User, bool]:
        """
        Obtiene o crea un usuario desde la respuesta OIDC.

        Args:
            response: Dict con claims de OIDC (sub, email, name, picture, etc.)
            backend_name: Nombre del backend de autenticación
            **kwargs: Parámetros adicionales

        Returns:
            Tupla (usuario, creado) donde creado es True si fue creado
        """
        try:
            # Extraer información de los claims OIDC
            sub = response.get("sub") or response.get("aud")
            email = response.get("email", "").lower()
            name = response.get("name", response.get("preferred_username", ""))
            picture = response.get("picture", "")

            if not email:
                logger.warning(
                    f"No email found in OIDC response for {backend_name}"
                )
                # Usar sub como fallback
                email = f"{sub}@{backend_name}.internal"

            if not name:
                name = email.split("@")[0]

            # Buscar usuario existente por email
            with transaction.atomic():
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": UserAuthWorkflowService._generate_username(
                            email
                        ),
                        "first_name": name.split()[0] if name else "",
                        "last_name": " ".join(name.split()[1:]) if name else "",
                    },
                )

                # Actualizar avatar si está disponible
                if picture and not user.avatar:
                    try:
                        user.avatar = picture
                    except Exception as e:
                        logger.debug(f"No se pudo actualizar avatar: {e}")

                # Marcar como activo si OIDC fue exitoso
                if not user.is_active:
                    user.is_active = True

                user.save(update_fields=["is_active", "avatar"])

                action = "created" if created else "updated"
                logger.info(
                    f"User {action}: {email} (sub={sub}, backend={backend_name})"
                )

                return user, created

        except Exception as e:
            logger.error(
                f"Error in get_or_create_user_from_oidc: {e}",
                exc_info=True
            )
            raise

    @staticmethod
    def _generate_username(email: str) -> str:
        """
        Genera un username único desde el email.

        Args:
            email: Dirección de email

        Returns:
            Username único y válido
        """
        # Usar parte del email antes de @
        base_username = email.split("@")[0]

        # Verificar que sea único
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Limitar a 150 caracteres (límite de Django)
        return username[:150]

    @staticmethod
    def update_user_from_oidc_response(
        user: User,
        response: Dict[str, Any]
    ) -> User:
        """
        Actualiza los datos del usuario desde la respuesta OIDC.

        Args:
            user: Usuario a actualizar
            response: Dict con claims de OIDC

        Returns:
            Usuario actualizado
        """
        try:
            changed = False

            # Actualizar nombre
            if "name" in response and response["name"]:
                name = response["name"]
                first_name = name.split()[0]
                last_name = " ".join(name.split()[1:]) if len(name.split()) > 1 else ""

                if user.first_name != first_name:
                    user.first_name = first_name
                    changed = True
                if user.last_name != last_name:
                    user.last_name = last_name
                    changed = True

            # Actualizar avatar
            if "picture" in response and response["picture"]:
                if user.avatar != response["picture"]:
                    user.avatar = response["picture"]
                    changed = True

            # Asegurar que esté activo
            if not user.is_active:
                user.is_active = True
                changed = True

            if changed:
                user.save()
                logger.info(f"User {user.email} updated from OIDC response")

            return user

        except Exception as e:
            logger.error(
                f"Error updating user {user.email} from OIDC: {e}",
                exc_info=True
            )
            return user

    @staticmethod
    def get_user_by_oidc_sub(sub: str) -> Optional[User]:
        """
        Obtiene un usuario por su 'sub' de OIDC.

        Args:
            sub: Subject claim del token OIDC

        Returns:
            Usuario si existe, None en caso contrario
        """
        # Buscar en los claims almacenados (si se implementa)
        # Por ahora, solo retornar None
        return None

    @staticmethod
    def handle_oauth_user_details(
        response: Dict[str, Any],
        details: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Procesa los detalles del usuario desde OAuth/OIDC.
        Pipeline hook compatible con python-social-auth.

        Args:
            response: Respuesta del proveedor OIDC
            details: Detalles procesados
            **kwargs: Parámetros adicionales

        Returns:
            Dict actualizado con detalles del usuario
        """
        # Asegurar que email está en detalles
        if "email" not in details and "email" in response:
            details["email"] = response["email"]

        # Agregar información adicional
        if "picture" in response:
            details["avatar"] = response["picture"]

        return details

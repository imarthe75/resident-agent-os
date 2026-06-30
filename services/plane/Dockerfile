FROM makeplane/plane-backend:v1.3.1

# Copiar implementación de UserAuthWorkflowService
COPY user_auth_workflow.py /code/plane/authentication/utils/user_auth_workflow.py

# Asegurar que existe el archivo __init__.py
RUN touch /code/plane/authentication/utils/__init__.py && \
    chmod 644 /code/plane/authentication/utils/user_auth_workflow.py

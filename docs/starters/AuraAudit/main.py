import os
import sys
import argparse
from dotenv import load_dotenv
from agent.loop import AuraAuditLoop

# Cargar variables de entorno desde archivo .env local
load_dotenv()

def main():
    parser = argparse.ArgumentParser(description="AuraAudit: Motor Cognitivo Local de Auditoría e IA.")
    parser.add_argument("target_dir", help="Directorio del proyecto a auditar")
    parser.add_argument("--output-dir", default="reportes_auditoria", help="Directorio donde se guardarán los reportes")
    
    args = parser.parse_args()
    
    # Resolver rutas absolutas
    target_abs = os.path.abspath(args.target_dir)
    output_abs = os.path.abspath(args.output_dir)
    
    if not os.path.exists(target_abs):
        print(f"[e] Error: El directorio destino '{target_abs}' no existe.")
        sys.exit(1)
        
    loop = AuraAuditLoop(target_abs, output_abs)
    
    try:
        loop.run_all()
    except Exception as e:
        print(f"[e] Error crítico durante el ciclo de ejecución: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

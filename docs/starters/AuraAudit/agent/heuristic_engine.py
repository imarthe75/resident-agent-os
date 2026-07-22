import os

class HeuristicEngine:
    def __init__(self, target_dir: str):
        self.target_dir = target_dir

    def detect_stack(self) -> dict:
        stack = {
            "has_java": False,
            "has_angular": False,
            "has_nginx": False,
            "has_node": False
        }

        if not os.path.exists(self.target_dir):
            return stack

        for root, dirs, files in os.walk(self.target_dir):
            if "node_modules" in root or ".git" in root:
                continue

            for file in files:
                if file.endswith(".java") or file in ["pom.xml", "build.gradle"]:
                    stack["has_java"] = True
                if file in ["angular.json", "tsconfig.json"]:
                    stack["has_angular"] = True
                if file == "nginx.conf":
                    stack["has_nginx"] = True
                if file == "package.json":
                    stack["has_node"] = True

        return stack

"""Allow `python -m agent <subcommand>` to invoke the unified `ros` CLI."""

import sys

from agent.cli import main

if __name__ == "__main__":
    sys.exit(main())

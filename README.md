<div align="center">
  <img src="./logo.svg" alt="Nul!Drift Logo" width="128" />
  <h1>Nul!Drift</h1>
  <p><b>A local, explainable feature-extraction system for detecting AI-generated prose.</b></p>
</div>

---

**🌐 Website URL:** [ ] *https://nul-drift-app-67.web.app/*

## Overview
Nul!Drift detects AI writing by measuring statistical smoothness. Human writers are rhythmically unpredictable; AI optimizes for predictable token distributions. We use 7 local, concrete statistical signals on passages to find these differences.

## Features
- **100% Local**: No API calls or cloud dependencies.
- **Explainable**: See exactly which statistical markers triggered suspicion.
- **Interactive CLI & Web UI**: Easy to use from the terminal or the browser.

## Tech Stack
### Backend
- **Python** & **FastAPI**: Core API logic and routing.
- **spaCy**: Advanced NLP processing and statistical signal extraction.
- **Docker**: Containerization for smooth deployment.

### Frontend
- **React**: Component-based UI.
- **Vite**: Lightning-fast build tool and development server.
- **Vanilla CSS**: Custom, lightweight styling system without heavy frameworks.

### Deployment
- **Render**: Backend API hosting.
- **Firebase Hosting**: Fast, global static hosting for the frontend.


## How to use the CLI

Nul!Drift features an interactive command-line interface that allows you to instantly analyze essays right from your terminal.

### 1. Installation

First, install the package locally using `pip`:
```bash
# From the root of the project directory
pip install -e .
```

### 2. Running the Interactive CLI

Simply type `nuldrift` in your terminal to launch the interactive prompt:

```bash
nuldrift
```

You will see an interactive prompt (`Nul!Drift > `) where you can paste essay text directly or provide the path to a text file. The system will instantly provide a formatted breakdown of the analysis!

*To exit the interactive CLI, type `exit` or `q`.*

### 3. One-Shot Command Analysis

You can also run Nul!Drift on a specific file or text snippet directly:

**Analyze a file:**
```bash
nuldrift analyze path/to/essay.txt
```

**Analyze inline text:**
```bash
nuldrift analyze --text "Your text here..."
```

**Output as JSON:**
```bash
nuldrift analyze path/to/essay.txt --json
```

---

## Contributing
Any changes, updates, or improvements are always welcome! Feel free to open an issue or submit a pull request if you'd like to contribute.

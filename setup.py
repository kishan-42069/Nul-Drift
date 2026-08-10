from setuptools import setup, find_packages

setup(
    name="nuldrift",
    version="1.0.0",
    packages=find_packages(),
    py_modules=["backend"],
    install_requires=[
        "spacy>=3.0.0",
        "typer>=0.9.0",
        "rich>=13.0.0",
    ],
    entry_points={
        "console_scripts": [
            "nuldrift=backend.cli:app",
        ],
    },
)

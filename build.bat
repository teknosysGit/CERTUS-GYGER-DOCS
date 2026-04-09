@echo off
setlocal

echo === Building Certus Flex ===
mkdocs build -f mkdocs.flex.en.yml -d site\certus-flex
if %ERRORLEVEL% NEQ 0 (echo BUILD FAILED for Certus Flex & exit /b 1)

echo === Building Certus Rivo ===
mkdocs build -f mkdocs.rivo.en.yml -d site\certus-rivo
if %ERRORLEVEL% NEQ 0 (echo BUILD FAILED for Certus Rivo & exit /b 1)

echo === Generating combined index ===
(
echo ^<!DOCTYPE html^>
echo ^<html^>^<head^>^<meta charset="utf-8"^>
echo ^<title^>Certus Documentation^</title^>
echo ^<style^>body{font-family:sans-serif;max-width:600px;margin:80px auto;padding:0 20px}
echo a{display:block;padding:16px;margin:12px 0;border:1px solid #ddd;border-radius:8px;text-decoration:none;color:#333;font-size:18px}
echo a:hover{background:#f5f5f5}^</style^>
echo ^</head^>^<body^>
echo ^<h1^>Certus Documentation^</h1^>
echo ^<a href="certus-flex/"^>Certus Flex Documentation^</a^>
echo ^<a href="certus-rivo/"^>Certus Rivo Documentation^</a^>
echo ^</body^>^</html^>
) > site\index.html

echo === Serving combined site ===
echo Open http://localhost:8000 in your browser
python -m http.server 8000 --directory site
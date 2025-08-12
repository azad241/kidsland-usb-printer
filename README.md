```
npm install
npm run dev
```

```
open http://localhost:3001
```

```
test print: http://localhost:3001/api/print
```

printer.bat
```
@echo off
cd /d paste_dir
start "" http://localhost:3001
npm run dev
pause
```
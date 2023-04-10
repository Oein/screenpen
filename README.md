# Build

```bash
yarn
npx tsc
npx electron-builder
```

# Fix mac os `is damaged and can’t be opened. You should move it to the Trash`

```bash
xattr -cr /path/to/screenpen.app
```

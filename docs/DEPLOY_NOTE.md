Deployment path note

- Example configs in this `deploy/` folder assume the application is installed at `/root/main/ClipX` on the VPS.
- If you deployed to a different path, update the following files accordingly:
  - `deploy/ecosystem.config.js` -> adjust `cwd` for `clipx-server`, `clipx-client`, and `clipx-bot` apps
  - `deploy/nginx_clipx0.conf` -> adjust `root` and any file paths
  - Bot venv path: `deploy/ecosystem.config.js` references `/root/main/ClipX/bot/.venv/bin/python` — change if your venv is elsewhere

Quick checklist after changing paths:
- Restart pm2 with the updated ecosystem file:

```powershell
pm2 start deploy/ecosystem.config.js --env production
pm2 save
```

- Test nginx config and reload:

```powershell
sudo nginx -t
sudo systemctl reload nginx
```

If you'd like, I can also patch `DEPLOYMENT.md` directly to include this note — tell me and I'll update it in-place.

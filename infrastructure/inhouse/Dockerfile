FROM mcr.microsoft.com/azure-functions/node:4-node22@sha256:db96ff70b60dbd5be5cb359cb64ffda865cf2f50fe665bdd2a964fd369634481
WORKDIR /home/site/wwwroot
COPY api/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY api/ ./
COPY infrastructure/inhouse/start.cjs infrastructure/inhouse/health.cjs /opt/justproveit/
USER 1000:1000
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 CMD ["node","/opt/justproveit/health.cjs"]
CMD ["node","/opt/justproveit/start.cjs"]

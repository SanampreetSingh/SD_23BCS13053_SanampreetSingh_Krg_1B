FROM node:22-slim

# 1. Install essential development tools + Process tools
RUN apt-get update && apt-get install -y \
    tini \
    build-essential \
    python3 \
    python3-pip \
    git \
    bash \
    curl \
    procps \
    vim \
    nano \
    sudo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Setup the User with a defined UID
RUN useradd -m -u 1001 -s /bin/bash codeuser && \
    echo "codeuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 3. Create the 'serve-link' utility script
RUN echo '#!/bin/bash\n\
PORT=$1\n\
PATH_SUFFIX=$2\n\
if [ -z "$PORT" ]; then\n\
  echo -e "\\e[1;31mError: Please provide a port (e.g., serve-link 3000)\\e[0m"\n\
  exit 1\n\
fi\n\
[[ "$PATH_SUFFIX" != /* && ! -z "$PATH_SUFFIX" ]] && PATH_SUFFIX="/$PATH_SUFFIX"\n\
echo -e "\\n\\e[1;32m🚀 PREVIEW ACTIVE\\e[0m"\n\
echo -e "\\e[1;34m🔗 Click here:\\e[0m ${PUBLIC_URL}${PATH_SUFFIX}?port=${PORT}\\n"' > /usr/bin/serve-link && \
chmod +x /usr/bin/serve-link

# 4. Setup Workspace
WORKDIR /home/codeuser/workspace
RUN chown -R codeuser:codeuser /home/codeuser/workspace

# 5. Environment for professional terminal feel
USER codeuser
ENV HOME=/home/codeuser
ENV TERM=xterm-256color
# Ensure servers listen on 0.0.0.0 for Nginx proxying
ENV HOST=0.0.0.0
ENV PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH}"

# 6. Shell Customization & Power-User Fixes
RUN echo 'echo -e "\\n\\e[1;33mWelcome to your IDE Workspace!\\e[0m"' >> ~/.bashrc && \
    echo 'echo -e "To preview your app, Enter the link in above provided Box"' >> ~/.bashrc && \
    # FIX: Use a function to override "npm run dev" with the host flag
    echo 'npm() { if [ "$1" = "run" ] && [ "$2" = "dev" ]; then command npm run dev -- --host 0.0.0.0 "${@:3}"; else command npm "$@"; fi; }' >> ~/.bashrc && \
    # FIX: Force bash to check window size after every command (prevents wrap bugs)
    echo "shopt -s checkwinsize" >> ~/.bashrc && \
    echo "alias cls='clear'" >> ~/.bashrc && \
    echo "alias ll='ls -la'" >> ~/.bashrc

# 7. Process Management
ENTRYPOINT ["/usr/bin/tini", "--"]

# 8. Keep-Alive Command
CMD ["tail", "-f", "/dev/null"]
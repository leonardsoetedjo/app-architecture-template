# See here for image contents: https://github.com/devcontainers/images/tree/main/src/java

ARG VARIANT="21"
FROM mcr.microsoft.com/devcontainers/java:${VARIANT}

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list>

# Install additional tools for Spring Boot development
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl \
        git \
        jq \
        less \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Default command
CMD ["sleep", "infinity"]

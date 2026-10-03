# Pinned Go 1.23.0 Bookworm reproducible builder base
FROM golang:1.23.0-bookworm@sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d

# Install git, dos2unix and ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /build

# Security: non-privileged build workspace
RUN mkdir -p /build/src /build/output && chmod 777 /build/src /build/output

CMD ["/bin/bash"]

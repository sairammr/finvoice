# Build the TEE proxy from Flare's source
FROM golang:1.23-alpine AS builder
RUN apk add --no-cache git
RUN git clone https://github.com/flare-foundation/tee-proxy.git /build
WORKDIR /build
RUN go build -o proxy ./cmd/proxy

FROM alpine:3.19
RUN apk add --no-cache wget ca-certificates
WORKDIR /app
COPY --from=builder /build/proxy ./proxy
RUN chmod +x ./proxy

EXPOSE 6663 6664

CMD ["./proxy", "--config", "/app/config/extension_proxy.toml"]

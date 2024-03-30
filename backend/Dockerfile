FROM golang:1.22.1

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./
COPY .env ./

EXPOSE 5000

RUN CGO_ENABLED=0 GOOS=linux go build -o /docker-gs-ping

CMD ["/docker-gs-ping"]


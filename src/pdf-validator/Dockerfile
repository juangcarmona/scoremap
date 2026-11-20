FROM python:3.12-slim@sha256:5e2bdb1b0d542d5039cffb8181c65930093949194a65c365dfb1b0fe13a4fa5b
ARG SOURCE_REVISION
LABEL org.opencontainers.image.revision=$SOURCE_REVISION
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY src/pdf-validator/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --require-hashes -r /app/requirements.txt
COPY src/pdf-validator/validate.py src/pdf-validator/validate_cli.py src/pdf-validator/server.py /app/
USER 65534:65534
EXPOSE 8123
CMD ["python", "-I", "/app/server.py"]

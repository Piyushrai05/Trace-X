from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    neo4j_uri: str = ""
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"
    frontend_origin: str = "http://localhost:5173"

    # CARTO Spatial API (gcp-asia-northeast1)
    carto_api_base: str = "https://gcp-asia-northeast1.api.carto.com"
    carto_access_token: str = ""
    carto_connection: str = "carto_dw"

    # Live Demo Mode
    demo_mode: bool = True

    # AI Agent / Copilot / Ask the Graph (Groq / Anthropic)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-sonnet-20241022"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()


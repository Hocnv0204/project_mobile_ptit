package com.ptit.mobile.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableFeignClients
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		loadDotenv();
		SpringApplication.run(BackendApplication.class, args);
	}

	private static void loadDotenv() {
		// Load variables from .env into System properties so Spring can resolve placeholders like ${VAR_NAME:default}.
		// We try both:
		// - repo root: ./backend/.env (common when running from repo root)
		// - module root: ./.env (common when running from backend/ directory)
		try {
			Dotenv dotenv = Dotenv.configure().directory("backend").ignoreIfMissing().load();
			applyDotenv(dotenv);

			Dotenv dotenvCurrentDir = Dotenv.configure().ignoreIfMissing().load();
			applyDotenv(dotenvCurrentDir);
		} catch (Exception ignored) {
			// If dotenv loading fails, continue with normal env/config behavior.
		}
	}

	private static void applyDotenv(Dotenv dotenv) {
		if (dotenv == null) return;
		dotenv.entries().forEach(entry -> {
			String key = entry.getKey();
			String value = entry.getValue();
			if (key == null || key.isBlank() || value == null) return;

			// Do not override real environment variables or already-set JVM properties.
			if (System.getenv(key) != null) return;
			if (System.getProperty(key) != null) return;

			System.setProperty(key, value);
		});
	}
}

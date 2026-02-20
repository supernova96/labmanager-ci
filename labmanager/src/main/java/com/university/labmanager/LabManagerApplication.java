package com.university.labmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@org.springframework.scheduling.annotation.EnableAsync
@org.springframework.context.annotation.ComponentScan(basePackages = "com.university.labmanager")
@org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackages = "com.university.labmanager.repository")
@org.springframework.boot.autoconfigure.domain.EntityScan(basePackages = "com.university.labmanager.model")
public class LabManagerApplication {

	// Triggering rebuild 3 - REBUILD ME PLEASE
	public static void main(String[] args) {
		SpringApplication.run(LabManagerApplication.class, args);
	}

}

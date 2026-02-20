package com.university.labmanager.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;

import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve uploaded files from the absolute path or relative to project root
        // Assuming uploads are stored in 'uploads/' directory in project root
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }

}

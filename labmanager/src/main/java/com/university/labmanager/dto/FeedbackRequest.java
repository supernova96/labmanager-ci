package com.university.labmanager.dto;

import lombok.Data;

@Data
public class FeedbackRequest {
    private Integer rating;
    private String feedback;
}

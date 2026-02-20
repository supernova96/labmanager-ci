package com.university.labmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {
    private Long laptopId;
    private LocalDateTime start;
    private LocalDateTime end;
    private String subject;
    private String professor;
    private Integer quantity;
}

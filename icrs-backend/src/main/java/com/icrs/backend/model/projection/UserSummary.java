package com.icrs.backend.model.projection;

import org.springframework.beans.factory.annotation.Value;

public interface UserSummary {
    Long getId();
    String getName();
    String getEmail();
    String getRole();
    
    @Value("#{target.department != null ? target.department.id : null}")
    Long getDepartmentId();

    @Value("#{target.department != null ? target.department.departmentName : null}")
    String getDepartmentName();
}

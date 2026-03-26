package com.icrs.backend.repository;

import com.icrs.backend.dto.ComplaintResponseDTO;
import com.icrs.backend.model.entity.Complaint;
import com.icrs.backend.model.entity.Department;
import com.icrs.backend.model.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    @EntityGraph(attributePaths = { "department", "user" })
    List<Complaint> findAll();

    @EntityGraph(attributePaths = { "department", "user" })
    List<Complaint> findByUser(User user);

    @EntityGraph(attributePaths = { "department", "user" })
    List<Complaint> findByDepartment(Department department);

    @Query("SELECT new com.icrs.backend.dto.ComplaintResponseDTO(" +
           "c.id, c.title, c.description, c.status, d.departmentName, " +
           "c.category, c.sentiment, c.priority, c.suggestedDepartment) " +
           "FROM Complaint c LEFT JOIN c.department d")
    List<ComplaintResponseDTO> findAllOptimized();

    @Query("SELECT new com.icrs.backend.dto.ComplaintResponseDTO(" +
           "c.id, c.title, c.description, c.status, d.departmentName, " +
           "c.category, c.sentiment, c.priority, c.suggestedDepartment) " +
           "FROM Complaint c LEFT JOIN c.department d WHERE c.user.email = :email")
    List<ComplaintResponseDTO> findDTOByEmail(String email);

    @Query("SELECT new com.icrs.backend.dto.ComplaintResponseDTO(" +
           "c.id, c.title, c.description, c.status, d.departmentName, " +
           "c.category, c.sentiment, c.priority, c.suggestedDepartment) " +
           "FROM Complaint c JOIN c.department d WHERE d.id = :deptId")
    List<ComplaintResponseDTO> findDTOByDepartmentId(Long deptId);

    long countByStatus(String status);

    // Department-wise complaint count
    @Query("SELECT c.department.departmentName, COUNT(c) FROM Complaint c GROUP BY c.department.departmentName")
    List<Object[]> countComplaintsByDepartment();

}

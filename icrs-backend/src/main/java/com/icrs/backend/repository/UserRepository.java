package com.icrs.backend.repository;

import com.icrs.backend.model.entity.User;
import com.icrs.backend.model.projection.UserSummary;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

	@EntityGraph(attributePaths = { "department" })
	Optional<User> findByEmail(String email);

	Optional<UserSummary> findSummaryByEmail(String email);
}

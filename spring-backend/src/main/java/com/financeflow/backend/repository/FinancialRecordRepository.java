package com.financeflow.backend.repository;

import com.financeflow.backend.model.FinancialRecord;
import com.financeflow.backend.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FinancialRecordRepository extends JpaRepository<FinancialRecord, Long> {
    List<FinancialRecord> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<FinancialRecord> findByType(TransactionType type);
    List<FinancialRecord> findByCategory(String category);
}

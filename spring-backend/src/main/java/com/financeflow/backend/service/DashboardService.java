package com.financeflow.backend.service;

import com.financeflow.backend.dto.DashboardSummary;
import com.financeflow.backend.model.FinancialRecord;
import com.financeflow.backend.model.TransactionType;
import com.financeflow.backend.repository.FinancialRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final FinancialRecordRepository recordRepository;

    public DashboardSummary getSummary() {
        List<FinancialRecord> allRecords = recordRepository.findAll();

        BigDecimal totalIncome = allRecords.stream()
                .filter(r -> r.getType() == TransactionType.INCOME)
                .map(FinancialRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = allRecords.stream()
                .filter(r -> r.getType() == TransactionType.EXPENSE)
                .map(FinancialRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netBalance = totalIncome.subtract(totalExpense);

        Map<String, BigDecimal> expensesByCategory = allRecords.stream()
                .filter(r -> r.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        FinancialRecord::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, FinancialRecord::getAmount, BigDecimal::add)
                ));

        return DashboardSummary.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netBalance(netBalance)
                .expensesByCategory(expensesByCategory)
                .build();
    }
}

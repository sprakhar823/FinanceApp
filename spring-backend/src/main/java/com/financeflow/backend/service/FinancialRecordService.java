package com.financeflow.backend.service;

import com.financeflow.backend.model.FinancialRecord;
import com.financeflow.backend.model.TransactionType;
import com.financeflow.backend.repository.FinancialRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialRecordService {

    private final FinancialRecordRepository financialRecordRepository;

    public List<FinancialRecord> getAllRecords() {
        return financialRecordRepository.findAll();
    }
    
    public List<FinancialRecord> getRecordsByType(TransactionType type) {
        return financialRecordRepository.findByType(type);
    }

    public FinancialRecord getRecordById(Long id) {
        return financialRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Record not found"));
    }

    public FinancialRecord createRecord(FinancialRecord record) {
        return financialRecordRepository.save(record);
    }

    public FinancialRecord updateRecord(Long id, FinancialRecord recordDetails) {
        FinancialRecord record = getRecordById(id);
        record.setAmount(recordDetails.getAmount());
        record.setType(recordDetails.getType());
        record.setCategory(recordDetails.getCategory());
        record.setDate(recordDetails.getDate());
        record.setNotes(recordDetails.getNotes());
        return financialRecordRepository.save(record);
    }

    public void deleteRecord(Long id) {
        FinancialRecord record = getRecordById(id);
        financialRecordRepository.delete(record);
    }
}

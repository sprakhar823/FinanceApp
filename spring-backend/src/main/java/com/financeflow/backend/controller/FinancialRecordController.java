package com.financeflow.backend.controller;

import com.financeflow.backend.model.FinancialRecord;
import com.financeflow.backend.model.TransactionType;
import com.financeflow.backend.service.FinancialRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class FinancialRecordController {

    private final FinancialRecordService recordService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<List<FinancialRecord>> getAllRecords(@RequestParam(required = false) TransactionType type) {
        if (type != null) {
            return ResponseEntity.ok(recordService.getRecordsByType(type));
        }
        return ResponseEntity.ok(recordService.getAllRecords());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<FinancialRecord> getRecordById(@PathVariable Long id) {
        return ResponseEntity.ok(recordService.getRecordById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FinancialRecord> createRecord(@RequestBody FinancialRecord record) {
        return ResponseEntity.ok(recordService.createRecord(record));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FinancialRecord> updateRecord(@PathVariable Long id, @RequestBody FinancialRecord record) {
        return ResponseEntity.ok(recordService.updateRecord(id, record));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteRecord(@PathVariable Long id) {
        recordService.deleteRecord(id);
        return ResponseEntity.ok().build();
    }
}

package com.ptit.mobile.backend.common.exception;

/**
 * Exception thrown when an entity is not found
 */
public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }
}

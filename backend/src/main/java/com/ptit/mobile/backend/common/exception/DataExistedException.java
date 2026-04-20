package com.ptit.mobile.backend.common.exception;

import lombok.Getter;

@Getter
public class DataExistedException extends RuntimeException{
    public DataExistedException(String message){
        super(message);
    }
}

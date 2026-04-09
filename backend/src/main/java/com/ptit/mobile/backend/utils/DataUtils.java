package com.ptit.mobile.backend.utils;

public class DataUtils {
    public static boolean isNullOrEmpty(Object obj1) {
        return obj1 == null || obj1.toString().trim().equals("");
    }

}

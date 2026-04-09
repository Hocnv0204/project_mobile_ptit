package com.ptit.mobile.backend.utils;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class PaginationUtils {
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int DEFAULT_PAGE_NUMBER = 0;

    public static Pageable createPageable(Integer number, Integer size, String sort, String order){
        int pageNumber = (number != null && number >= 0 ) ? number : DEFAULT_PAGE_NUMBER;
        int pageSize = (size != null && size > 0) ? size : DEFAULT_PAGE_SIZE;
        String pageSort = (sort != null && !DataUtils.isNullOrEmpty(sort)) ? sort : "id";
        Sort.Direction pageOrder = (order != null && !DataUtils.isNullOrEmpty(order)) ? Sort.Direction.fromString(order) : Sort.Direction.DESC ;
        return PageRequest.of(pageNumber, pageSize, pageOrder, pageSort);
    }
}


package com.ptit.mobile.backend.dto.request.topic;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateTopicRequest {

    private String name;
    private String description;
    private String note;

}

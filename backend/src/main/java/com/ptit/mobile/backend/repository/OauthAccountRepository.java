package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.OauthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OauthAccountRepository extends JpaRepository<OauthAccount, Long> {

    Optional<OauthAccount> findByProviderAndProviderUserId(String provider, String providerUserId);

    boolean existsByProviderAndProviderUserId(String provider, String providerUserId);
}

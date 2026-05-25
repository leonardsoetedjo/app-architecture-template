package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MfaMethodTest {
    
    @Test
    void testMfaMethodHasThreeTypes() {
        assertEquals("TOTP", MfaMethod.TOTP.getValue());
        assertEquals("WEBAUTHN", MfaMethod.WEBAUTHN.getValue());
        assertEquals("BACKUP_CODE", MfaMethod.BACKUP_CODE.getValue());
    }
    
    @Test
    void testMfaMethodValueOf() {
        assertEquals(MfaMethod.TOTP, MfaMethod.valueOf("TOTP"));
        assertEquals(MfaMethod.WEBAUTHN, MfaMethod.valueOf("WEBAUTHN"));
        assertEquals(MfaMethod.BACKUP_CODE, MfaMethod.valueOf("BACKUP_CODE"));
    }
}

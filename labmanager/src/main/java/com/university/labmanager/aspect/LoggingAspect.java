package com.university.labmanager.aspect;

import com.university.labmanager.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

@Aspect
@Component
@RequiredArgsConstructor
public class LoggingAspect {

    private final LogService logService;

    // Define Pointcut: All methods in 'controller' package
    @Pointcut("execution(* com.university.labmanager.controller..*(..))")
    public void controllerMethods() {
    }

    @Around("controllerMethods()")
    public Object logControllerActivity(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        Object[] args = joinPoint.getArgs();

        // Get Current User
        String username = "ANONYMOUS";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            username = auth.getName();
        }

        // Skip logging for simple "GET" calls that are just fetching data to avoid spam
        // (Optional)
        // Or keep them for full audit trail. Let's keep data modification ones +
        // Errors.
        // Actually, let's just log everything but maybe mark GETs as INFO_READ vs State
        // change.
        // For simplicity: Log entry and exit or just success/fail.

        // Let's rely on basic logging.

        try {
            Object result = joinPoint.proceed();

            // Should we log success? Yes, but maybe cluttering DB.
            // Strategy: Log only if it is NOT a "get" method?, or assume "get" methods are
            // safe.
            // OR: Log all "mutating" operations (POST, PUT, DELETE) + Login/Logout.
            // We can check method prefix or HTTP method if available.

            // Let's get Request Method
            try {
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                        .getRequestAttributes();
                if (attributes != null) {
                    HttpServletRequest request = attributes.getRequest();
                    String method = request.getMethod(); // GET, POST, etc.

                    if (!"GET".equalsIgnoreCase(method)) {
                        // Only log state-changing operations to avoid spamming "GetAllLaptops" 50 times
                        logService.info("ACTION",
                                String.format("User %s performed %s on %s. Result: Success", username, method,
                                        className),
                                username);
                    }
                }
            } catch (Exception ex) {
                // ignore aspect internal error
            }

            return result;

        } catch (Throwable e) {
            // Log Error!
            logService.error("ERROR",
                    String.format("Exception in %s.%s: %s", className, methodName, e.getMessage()),
                    username);
            throw e; // Re-throw to let normal handling occur
        }
    }
}

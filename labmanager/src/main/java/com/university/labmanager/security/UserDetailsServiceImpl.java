package com.university.labmanager.security;

import com.university.labmanager.model.User;
import com.university.labmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String matricula) throws UsernameNotFoundException {
        User user = userRepository.findByMatricula(matricula)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with matricula: " + matricula));

        return UserDetailsImpl.build(user);
    }
}

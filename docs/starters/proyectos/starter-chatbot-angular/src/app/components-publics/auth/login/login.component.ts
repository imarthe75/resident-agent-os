import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    template: ``
})
export class LoginComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);

    ngOnInit(): void {
        const returnUrl = this.resolveReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        this.authService.iniciarLogin(returnUrl);
    }

    private resolveReturnUrl(returnUrl: string | null): string {
        if (!returnUrl || !returnUrl.startsWith('/')) {
            return '/dashboard';
        }

        if (returnUrl === '/notfound' || returnUrl.startsWith('/auth')) {
            return '/dashboard';
        }

        return returnUrl;
    }
}

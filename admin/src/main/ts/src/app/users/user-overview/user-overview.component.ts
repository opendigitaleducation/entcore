import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { OdeComponent } from 'ngx-ode-core';
import { BundlesService } from 'ngx-ode-sijil';

export interface UserOverview {
    displayName: string;
    type: string;
    activationCode: string;
    firstName: string;
    lastName: string;
    login: string;
    birthDate: string;
    email: string;
    source: string;
    structures: string[];
}

@Component({
    selector: 'ode-user-overview',
    templateUrl: './user-overview.component.html',
    styleUrls: ['./user-overview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserOverviewComponent extends OdeComponent {
    @Input()
    user: UserOverview;

    constructor(injector: Injector,
                private bundlesService: BundlesService) {
                    super(injector);
    }

    displayDate(date: string): string {
        return new Date(date).toLocaleDateString(this.bundlesService.currentLanguage);
    }
}

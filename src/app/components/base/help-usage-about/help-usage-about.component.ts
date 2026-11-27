import { Component } from '@angular/core';
import { VERSION_WEB_PUBLICADA } from 'src/app/config/version';

@Component({
    selector: 'app-help-usage-about',
    templateUrl: './help-usage-about.component.html',
    standalone: false
})
export class HelpUsageAboutComponent {
    readonly version = VERSION_WEB_PUBLICADA;
}

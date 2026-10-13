export const BUTTONS_TS_SNIPPET = `  import {Component} from '@angular/core';
    import {MatButtonModule} from '@angular/material/button';
    import {MatIconModule} from '@angular/material/icon';
    import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';

    /**
     * @title Basic buttons
     */
    @Component({
        selector: 'app-button',
        imports: [MatButtonModule, MatIconModule, DesignSystemIconsModule],
        templateUrl: './button.component.html'
    })
    export class AppButtonComponent {
        constructor() {}
    }
`;

export const TOGGLE_BUTTONS_TS_SNIPPET = `  import {Component} from '@angular/core';
    import {MatButtonToggleModule} from '@angular/material/button-toggle';
    import {MatIconModule} from '@angular/material/icon';
    import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

    /**
     * @title Basic button-toggles
     */
    @Component({
        selector: 'app-button',
        imports: [MatButtonToggleModule, MatIconModule, FormsModule, ReactiveFormsModule],
        templateUrl: './button.component.html'
    })
    export class AppButtonComponent {
        constructor() {}
        
        //   reactive form
        fontStyleControl = new FormControl('');
        fontStyle?: string;
    }
`;
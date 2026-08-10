import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@kuetelabs/frontend/ui/components/sonner';

@Component({
  imports: [RouterOutlet, ...HlmToasterImports],
  selector: 'admin-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}

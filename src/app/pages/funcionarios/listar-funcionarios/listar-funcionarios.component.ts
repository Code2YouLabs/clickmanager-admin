import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { FiltroPesquisaCardComponent } from 'src/app/components/filtro-pesquisa-card/filtro-pesquisa-card.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { Funcionario } from '../models/funcionario.model';
import { FuncionariosService } from '../services/funcionarios.service';

@Component({
  selector: 'app-listar-funcionarios',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageCardComponent,
    SectionCardComponent,
    FiltroPesquisaCardComponent,
    StatusBadgeComponent,
    TemPermissaoDirective
  ],
  templateUrl: './listar-funcionarios.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './listar-funcionarios.component.scss'
})
export class ListarFuncionariosComponent implements OnInit {
  displayedColumns = ['nome', 'cargo', 'setor', 'status', 'admissao', 'acoes'];
  funcionarios: Funcionario[] = [];
  statusOptions = ['TODOS', 'ATIVO', 'AFASTADO', 'DESLIGADO'];
  statusSelecionado = 'TODOS';
  resumo = { total: 0, ativos: 0, afastados: 0, desligados: 0 };
  filtroAtual = '';

  constructor(
    private readonly service: FuncionariosService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.service.kpis$().subscribe((kpi) => (this.resumo = kpi));
    this.carregar();
  }

  carregar(): void {
    this.service.listar$(this.filtroAtual, this.statusSelecionado).subscribe((lista) => {
      this.funcionarios = lista;
    });
  }

  onPesquisar(valor: string): void {
    this.filtroAtual = valor || '';
    this.carregar();
  }

  onStatusChange(valor: string): void {
    this.statusSelecionado = valor || 'TODOS';
    this.carregar();
  }

  novo(): void {
    this.router.navigate(['/page/funcionarios/novo']);
  }

  editar(item: Funcionario): void {
    this.router.navigate(['/page/funcionarios/editar', item.id]);
  }

  detalhar(item: Funcionario): void {
    this.router.navigate(['/page/funcionarios/detalhe', item.id]);
  }

}

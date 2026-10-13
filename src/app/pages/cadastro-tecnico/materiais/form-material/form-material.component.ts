import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { Material } from 'src/app/models/material.model';
import { MaterialService } from '../../services/material.service';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";
import { SharedComponentsModule } from 'src/app/components/shared-components.module';

@Component({
  selector: 'app-form-material',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    CardHeaderComponent,
    SharedComponentsModule
],
  templateUrl: './form-material.component.html',
  styleUrl: './form-material.component.scss'
})
export class FormMaterialComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  materialId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private materialService: MaterialService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required]
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.materialId = +id;
        this.carregarMaterial(this.materialId);
      }
    });
  }

  carregarMaterial(id: number): void {
    this.materialService.buscarPorId(id).subscribe({
      next: (material: Material) => {
        this.form.patchValue({
          nome: material.nome,
          descricao: material.descricao
        });
      },
      error: () => {
        this.toastr.error('Erro ao carregar material.');
        this.router.navigate(['/page/cadastro-tecnico/materiais']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const materialData = this.form.value as Material;

    if (this.isEditMode) {
      this.materialService.atualizar(this.materialId, materialData).subscribe({
        next: () => {
          this.toastr.success('Material atualizado com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/materiais']);
        },
        error: () => this.toastr.error('Erro ao atualizar material.')
      });
    } else {
      this.materialService.salvar(materialData).subscribe({
        next: () => {
          this.toastr.success('Material criado com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/materiais']);
        },
        error: () => this.toastr.error('Erro ao criar material.')
      });
    }
  }

  updateErrorMessage(): void {
    Object.keys(this.form.controls).forEach(field => {
      const control = this.form.get(field);
      if (control && control.invalid && (control.dirty || control.touched)) {
        control.markAsTouched();
      }
    });
  }

  getErrorMessage(campo: string): string {
    const control = this.form.get(campo);
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'Campo inválido';
  }

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get descricaoControl(): FormControl {
    return this.form.get('descricao') as FormControl;
  }
}

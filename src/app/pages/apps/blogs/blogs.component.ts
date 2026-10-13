import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { blogService } from 'src/app/services/apps/blog/blog.service';
import { MatCardModule } from '@angular/material/card';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MatChipsModule } from '@angular/material/chips';

@Component({
    selector: 'app-blogs',
    imports: [MatCardModule, DesignSystemIconsModule, MatChipsModule],
    templateUrl: './blogs.component.html'
}) 
export class AppBlogsComponent implements OnInit {
  posts = this.blogService.getBlog();

  constructor(public router: Router, public blogService: blogService) {}

  selectBlog(title: string) {
    this.blogService.selectBlogPost(title);
    this.router.navigate(['apps/blog/detail', title]);
  }
  ngOnInit(): void {
  }
}

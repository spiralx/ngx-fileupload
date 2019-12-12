import { Component, OnInit, Inject } from "@angular/core";
import { UploadStorage } from "projects/ngx-fileupload/public-api";
import { ExampleUploadStorage } from "@ngx-fileupload-example/data/base/upload-storage";

@Component({
    selector: "app-dashboard",
    templateUrl: "dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"]
})
export class DashboardComponent implements OnInit {

    constructor(
        @Inject(ExampleUploadStorage) public storage: UploadStorage
    ) { }

    ngOnInit() { }
}

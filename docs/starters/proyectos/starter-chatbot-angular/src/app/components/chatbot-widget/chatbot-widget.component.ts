import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-chatbot-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="chatbot-widget-container">
            <!-- Launcher Button -->
            <button
                (click)="toggleChat()"
                class="chatbot-launcher-btn"
                [style.background-color]="primaryColor"
            >
                <span *ngIf="!isOpen">💬</span>
                <span *ngIf="isOpen">✕</span>
            </button>

            <!-- Chat Window -->
            <div *ngIf="isOpen" class="chatbot-window shadow-2xl animate-fade-in">
                <!-- Header -->
                <div class="chatbot-header" [style.background-color]="primaryColor">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
                        <div>
                            <h4 class="text-sm font-bold text-white leading-tight">{{ botName }}</h4>
                            <p class="text-[10px] text-white/80 leading-none">Tema: {{ profileId }}</p>
                        </div>
                    </div>
                </div>

                <!-- Iframe body -->
                <div class="chatbot-body">
                    <iframe
                        [src]="sanitizedUrl"
                        frameborder="0"
                        class="w-full h-full border-0"
                        allow="clipboard-write"
                    ></iframe>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .chatbot-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        .chatbot-launcher-btn {
            width: 60px;
            height: 60px;
            border-radius: 30px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.3s ease;
            font-size: 28px;
            border: none;
            outline: none;
        }
        .chatbot-launcher-btn:hover {
            transform: scale(1.08);
        }
        .chatbot-window {
            width: 420px;
            height: 600px;
            background: white;
            border-radius: 20px;
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.08);
        }
        .chatbot-header {
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .chatbot-body {
            flex: 1;
            background: #f8fafc;
            position: relative;
        }
        .animate-fade-in {
            animation: fadeIn 0.25s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
            .chatbot-window {
                width: calc(100vw - 40px);
                height: calc(100vh - 120px);
            }
        }
    `]
})
export class ChatbotWidgetComponent implements OnInit {
    private sanitizer = inject(DomSanitizer);

    @Input() primaryColor: string = '#004a87';
    @Input() botName: string = 'Asistente Experto';
    @Input() endpoint: string = 'http://localhost:3001';
    @Input() profileId: string = 'general';
    @Input() isOpen: boolean = false;

    sanitizedUrl!: SafeResourceUrl;

    ngOnInit(): void {
        const rawUrl = `${this.endpoint}/widget?profile_id=${this.profileId}`;
        this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    }

    toggleChat(): void {
        this.isOpen = !this.isOpen;
    }
}

import { useNavigate } from 'react-router';
import { FileText, BookOpen, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/ui/card';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      title: 'Documentos',
      description: 'Gerencie seus PDFs e artigos científicos',
      icon: FileText,
      path: '/documents',
    },
    {
      title: 'Bibliotecas',
      description: 'Organize seus documentos em bibliotecas',
      icon: BookOpen,
      path: '/documents',
    },
    {
      title: 'Chat com IA',
      description: 'Converse com seus documentos usando IA',
      icon: MessageSquare,
      path: '/documents',
    },
    {
      title: 'Configurações',
      description: 'Gerencie sua conta e preferências',
      icon: Settings,
      path: '/settings',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Noesis, <span className="font-medium text-foreground">{user?.email}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(feature.path)}
            >
              <CardHeader className="pb-2">
                <Icon className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-sm">{feature.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, FlaskConical, AlertTriangle } from 'lucide-react';
import { useBetaFeatures } from '@/contexts/beta-features-context';
import type { BetaFeature, FeatureMaturity } from 'shared/forge-types';

function MaturityBadge({ maturity }: { maturity: FeatureMaturity }) {
  const variants: Record<FeatureMaturity, { className: string; label: string }> =
    {
      experimental: {
        className:
          'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20',
        label: 'Experimental',
      },
      beta: {
        className:
          'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
        label: 'Beta',
      },
      stable: {
        className:
          'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
        label: 'Stable',
      },
    };

  const variant = variants[maturity];

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

function FeatureRow({
  feature,
  onToggle,
  isToggling,
}: {
  feature: BetaFeature;
  onToggle: (featureId: string) => void;
  isToggling: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{feature.name}</span>
          <MaturityBadge maturity={feature.maturity} />
        </div>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </div>
      <div className="flex items-center">
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={feature.enabled}
            onCheckedChange={() => onToggle(feature.id)}
          />
        )}
      </div>
    </div>
  );
}

export function BetaFeaturesSettings() {
  const { t } = useTranslation(['settings', 'common']);
  const { features, loading, error, toggleFeature } = useBetaFeatures();

  const handleToggle = async (featureId: string) => {
    try {
      await toggleFeature(featureId);
    } catch (err) {
      console.error('Failed to toggle feature:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('settings.betaFeatures.error', {
            defaultValue: 'Failed to load beta features',
          })}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            {t('settings.betaFeatures.title', { defaultValue: 'Beta Features' })}
          </CardTitle>
          <CardDescription>
            {t('settings.betaFeatures.description', {
              defaultValue:
                'Enable experimental features to try new functionality before general release.',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('settings.betaFeatures.warning', {
                defaultValue:
                  'Beta features are experimental and may be unstable. Use at your own risk.',
              })}
            </AlertDescription>
          </Alert>

          {features.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {t('settings.betaFeatures.noFeatures', {
                  defaultValue: 'No beta features available at this time.',
                })}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {features.map((feature) => (
                <FeatureRow
                  key={feature.id}
                  feature={feature}
                  onToggle={handleToggle}
                  isToggling={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

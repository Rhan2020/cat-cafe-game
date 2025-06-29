import React, { useEffect, useState } from 'react';
import { Button, message, Spin, Card, Input } from 'antd';
import { useCloud } from '../services/CloudProvider';
import AceEditor from 'react-ace';

// Import editor themes and modes
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';

interface ConfigDoc {
  _id: string;
  data: any;
}

export const ConfigEditor: React.FC = () => {
  const { db } = useCloud();
  const [configs, setConfigs] = useState<ConfigDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const fetchConfigs = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const result = await db.collection('game_configs').get();
      setConfigs(result.data);
    } catch (error) {
      message.error('Failed to fetch game configurations.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (db) {
      fetchConfigs();
    }
  }, [db]);

  const handleSave = async (docId: string, content: string) => {
    if (!db) return;
    setSaving(prev => ({ ...prev, [docId]: true }));
    try {
      const parsedData = JSON.parse(content);
      await db.collection('game_configs').doc(docId).update({
        data: { data: parsedData }
      });
      message.success(`Configuration '${docId}' saved successfully!`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        message.error('Invalid JSON format. Please check your syntax.');
      } else {
        message.error(`Failed to save configuration '${docId}'.`);
      }
      console.error(error);
    } finally {
      setSaving(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleConfigChange = (newValue: string, docId: string) => {
    try {
      setConfigs(configs.map(c => c._id === docId ? { ...c, data: JSON.parse(newValue) } : c));
    } catch (e) {
      // Ignore JSON parsing errors during typing
    }
  };

  if (loading) {
    return <Spin tip="Loading Configurations..." />;
  }

  return (
    <div>
      {configs.map(config => (
        <Card
          key={config._id}
          title={`Edit Configuration: ${config._id}`}
          style={{ marginBottom: 24 }}
          extra={
            <Button
              type="primary"
              onClick={() => handleSave(config._id, JSON.stringify(config.data, null, 2))}
              loading={saving[config._id]}
            >
              Save
            </Button>
          }
        >
          <AceEditor
            mode="json"
            theme="github"
            width="100%"
            value={JSON.stringify(config.data, null, 2)}
            onChange={(newValue) => handleConfigChange(newValue, config._id)}
            name={`editor_${config._id}`}
            editorProps={{ $blockScrolling: true }}
            setOptions={{ useWorker: false }} // To disable syntax checking worker
          />
        </Card>
      ))}
    </div>
  );
}; 
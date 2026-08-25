-- CreateIndex
CREATE UNIQUE INDEX "CategoryVariantAxis_categoryId_name_key" ON "CategoryVariantAxis"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryVariantAxisValue_axisId_value_key" ON "CategoryVariantAxisValue"("axisId", "value");
